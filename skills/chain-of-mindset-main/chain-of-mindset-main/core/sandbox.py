import abc
import ast
import os
import subprocess
import sys
import tempfile
import time
import uuid
from typing import Tuple, List, Optional

class BaseSandbox(abc.ABC):
    """Abstract Base Class for Code Execution Sandbox."""
    @abc.abstractmethod
    def run_code(self, code: str, timeout: int = 30) -> Tuple[str, str]:
        """Execute code and return (stdout, stderr)."""
        pass

    def _extract_imports(self, code: str) -> List[str]:
        """Static analysis to extract imported module names."""
        imports = set()
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split('.')[0])
        except Exception:
            pass
        return list(imports)

class LocalSandbox(BaseSandbox):
    """Local Process Sandbox (Fallback)."""
    def __init__(self):
        self.forbidden_functions = [
            "os.system", "os.popen", "os.spawn", "os.execl", 
            "subprocess.run", "subprocess.Popen", "subprocess.call",
            "shutil.rmtree"
        ]

    def _security_check(self, code: str) -> Optional[str]:
        """Basic AST scan for forbidden functions."""
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if isinstance(node.func.value, ast.Name):
                            call_name = f"{node.func.value.id}.{node.func.attr}"
                            if call_name in self.forbidden_functions:
                                return f"Security Violation: Call to '{call_name}' is forbidden in Local Mode."
                    elif isinstance(node.func, ast.Name):
                        if node.func.id in ["exec", "eval"]:
                             return f"Security Violation: Call to '{node.func.id}' is forbidden in Local Mode."
        except SyntaxError:
            return "Syntax Error during security scan."
        return None

    def run_code(self, code: str, timeout: int = 30) -> Tuple[str, str]:
        security_error = self._security_check(code)
        if security_error:
            return "", security_error

        required_modules = self._extract_imports(code)
        missing_modules = []
        for mod in required_modules:
            if mod in sys.builtin_module_names:
                continue
            try:
                __import__(mod)
            except ImportError:
                missing_modules.append(mod)
        
        if missing_modules:
            return "", (
                f"Dependency Error: The following modules are missing: {missing_modules}.\n"
                f"Running in Local Fallback Mode: Auto-installation is DISABLED to protect your environment.\n"
                f"Please install them manually via 'pip install {' '.join(missing_modules)}'."
            )

        with tempfile.TemporaryDirectory() as temp_dir:
            script_path = os.path.join(temp_dir, f"script_{uuid.uuid4().hex}.py")
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(code)
            
            try:
                env = os.environ.copy()
                env["PYTHONIOENCODING"] = "utf-8"

                result = subprocess.run(
                    [sys.executable, script_path],
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    timeout=timeout,
                    cwd=temp_dir,
                    env=env
                )
                return result.stdout, result.stderr
            except subprocess.TimeoutExpired:
                return "", f"Execution timed out after {timeout} seconds."
            except Exception as e:
                return "", f"System Error: {str(e)}"

class DockerSandbox(BaseSandbox):
    """Docker Container Sandbox."""
    def __init__(self, image: str = "python:3.9-slim"):
        self.image = image
        self.container_name = f"agent_sandbox_{uuid.uuid4().hex[:8]}"
        self._start_container()

    def _start_container(self):
        """Start a long-running container."""
        try:
            subprocess.run(
                ["docker", "run", "-d", "--rm", "--name", self.container_name, self.image, "sleep", "infinity"],
                check=True, capture_output=True
            )
            self._exec_run(["pip", "install", "--upgrade", "pip"], check=False)
        except Exception as e:
            raise e

    def _exec_run(self, cmd: List[str], timeout: int = 60, check: bool = True) -> Tuple[str, str]:
        """Helper to run command inside container."""
        full_cmd = ["docker", "exec", self.container_name] + cmd
        result = subprocess.run(full_cmd, capture_output=True, text=True, timeout=timeout)
        if check and result.returncode != 0:
            raise RuntimeError(f"Command failed: {result.stderr}")
        return result.stdout, result.stderr

    def _install_dependencies(self, modules: List[str]):
        """Auto-install missing modules."""
        if not modules:
            return
        
        to_install = []
        for mod in modules:
            try:
                self._exec_run(["python", "-c", f"import {mod}"], check=True)
                continue 
            except RuntimeError:
                pass

            pkg_name = mod
            if mod == "sklearn": pkg_name = "scikit-learn"
            if mod == "cv2": pkg_name = "opencv-python-headless"
            if mod == "PIL": pkg_name = "Pillow"
            
            to_install.append(pkg_name)
        
        if to_install:
            try:
                self._exec_run(["pip", "install"] + to_install, timeout=120)
            except Exception as e:
                pass

    def run_code(self, code: str, timeout: int = 30) -> Tuple[str, str]:
        imports = self._extract_imports(code)
        self._install_dependencies(imports)

        with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        
        container_path = f"/tmp/script_{uuid.uuid4().hex}.py"
        try:
            subprocess.run(["docker", "cp", tmp_path, f"{self.container_name}:{container_path}"], check=True)
            
            stdout, stderr = self._exec_run(["python", container_path], timeout=timeout, check=False)
            return stdout, stderr
            
        except subprocess.TimeoutExpired:
            return "", f"Execution timed out after {timeout} seconds."
        except Exception as e:
            return "", f"Docker Error: {str(e)}"
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def cleanup(self):
        """Stop and remove container."""
        try:
            if subprocess is None:
                return
            subprocess.run(["docker", "stop", self.container_name], capture_output=True)
        except Exception:
            pass

    def __del__(self):
        try:
            self.cleanup()
        except Exception:
            pass

class SandboxFactory:
    _instance = None

    @staticmethod
    def get_sandbox() -> BaseSandbox:
        if SandboxFactory._instance:
            return SandboxFactory._instance
            
        try:
            subprocess.run(["docker", "--version"], check=True, capture_output=True)
            SandboxFactory._instance = DockerSandbox()
        except (subprocess.CalledProcessError, FileNotFoundError):
            SandboxFactory._instance = LocalSandbox()
            
        return SandboxFactory._instance
