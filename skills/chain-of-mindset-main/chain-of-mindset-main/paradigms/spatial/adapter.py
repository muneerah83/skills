import os
import re
import tempfile
import subprocess
import sys
from typing import Tuple, List, Optional, Dict, Any
from paradigms.base import BaseParadigm
from core.protocol import ParadigmOutput

class SpatialParadigm(BaseParadigm):
    """Spatial Mindset for visual-spatial thinking and image generation."""
    def __init__(self, llm_client, image_client, sandbox=None):
        self.llm_client = llm_client
        self.image_client = image_client 
        self.sandbox = sandbox  # For executing matplotlib code 

    @property
    def name(self) -> str:
        return "spatial"

    @property
    def trigger_token(self) -> str:
        return "<call_spatial>"

    @property
    def end_token(self) -> str:
        return "</call_spatial>"
    
    @property
    def result_tokens(self) -> Tuple[str, str]:
        return ("<spatial_result>", "</spatial_result>")

    def execute(self, instruction: str, params: Optional[Dict[str, Any]] = None, context: Optional[Dict[str, Any]] = None) -> ParadigmOutput:
        """Execute image generation."""
        referenced_images = context.get("referenced_images", []) if context else []
        self.append_xml_log("referenced_images", str(referenced_images), context)
        
        session_dir = context.get("session_dir") if context else None
        
        MAX_RETRIES = 3
        retry_count = 0
        last_error = None

        while retry_count < MAX_RETRIES:
            try:
                self.append_xml_log("generation_attempt", f"Attempt {retry_count + 1}, Reference Images: {len(referenced_images)}", context)
                
                result = self.image_client.generate(
                    prompt=instruction, 
                    base_images=referenced_images if referenced_images else None,
                    output_dir=session_dir
                )
                
                image_path = result.get("image_path")
                text_content = result.get("text_content")
                
                if not image_path and text_content:
                    matplotlib_code = self._extract_matplotlib_code(text_content)
                    if matplotlib_code:
                        self.append_xml_log("matplotlib_code_detected", f"Length: {len(matplotlib_code)}", context)
                        code_result = self._execute_matplotlib_code(matplotlib_code, session_dir)
                        if code_result.get("image_path"):
                            image_path = code_result["image_path"]
                            self.append_xml_log("matplotlib_execution_success", f"Image: {image_path}", context)
                        elif code_result.get("error"):
                            self.append_xml_log("matplotlib_execution_error", code_result["error"], context)
                
                if image_path or text_content:
                    self.append_xml_log("generation_success", f"Image: {image_path}, Text Length: {len(text_content) if text_content else 0}", context)
                    
                    if text_content:
                        self.append_xml_log("gemini_text_output", text_content, context)
                    
                    artifacts = []
                    summary_parts = []
                    raw_lines = []
                    
                    if image_path:
                        artifacts.append(image_path)
                        summary_parts.append(f"Visualization generated: {image_path}")
                        raw_lines.append(f"Image generated at {image_path}")
                        
                    if text_content and not image_path:
                        summary_parts.append(f"Generator notes:\n{text_content}")
                        raw_lines.append(text_content)
                    elif text_content and image_path:
                        raw_lines.append(f"Gemini notes: {text_content}")
                        
                    return ParadigmOutput(
                        status="VIABLE",
                        summary="\n".join(summary_parts),
                        raw_output="\n".join(raw_lines),
                        artifacts=artifacts
                    )
                else:
                    self.append_xml_log("generation_error", "Returned no content", context)
                    retry_count += 1
                    
            except Exception as e:
                self.append_xml_log("generation_exception", str(e), context)
                last_error = e
                retry_count += 1
        
        # If all retries fail
        return ParadigmOutput(
            status="INCOMPLETE",
            summary=f"Failed to generate visualization after {MAX_RETRIES} attempts. Error: {str(last_error)}",
            raw_output=str(last_error),
            artifacts=[]
        )
    
    def _extract_matplotlib_code(self, text: str) -> Optional[str]:
        """Extract matplotlib/Python visualization code from text."""
        code_block_pattern = r'```(?:python)?\s*([\s\S]*?)```'
        matches = re.findall(code_block_pattern, text)
        
        for code in matches:
            viz_indicators = ['matplotlib', 'plt.', 'pyplot', 'seaborn', 'sns.', 
                            'fig,', 'figure(', 'subplot', 'plot(', 'scatter(', 
                            'imshow(', 'savefig(', 'Circle(', 'patches']
            if any(indicator in code for indicator in viz_indicators):
                return code.strip()
        
        if 'import matplotlib' in text or 'from matplotlib' in text:
            lines = text.split('\n')
            code_lines = []
            in_code = False
            
            for line in lines:
                if 'import' in line or in_code:
                    in_code = True
                    code_lines.append(line)
                    if 'plt.show()' in line or 'plt.savefig' in line or 'fig.savefig' in line:
                        break
            
            if code_lines:
                return '\n'.join(code_lines)
        
        return None
    
    def _execute_matplotlib_code(self, code: str, output_dir: str) -> Dict[str, Any]:
        """Execute matplotlib code and save the resulting image."""
        result = {"image_path": None, "error": None}
        
        import time
        timestamp = int(time.time() * 1000)
        output_filename = f"matplotlib_{timestamp}.png"
        output_path = os.path.join(output_dir, output_filename) if output_dir else output_filename
        
        modified_code = self._prepare_code_for_execution(code, output_path)
        
        if self.sandbox:
            try:
                stdout, stderr = self.sandbox.run_code(modified_code, timeout=60)
                if os.path.exists(output_path):
                    result["image_path"] = output_path
                else:
                    result["error"] = f"Sandbox execution completed but no image produced. Stderr: {stderr}"
                return result
            except Exception as e:
                result["error"] = f"Sandbox execution failed: {str(e)}"
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write(modified_code)
                temp_script = f.name
            
            process = subprocess.run(
                [sys.executable, temp_script],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=output_dir if output_dir else None
            )
            
            try:
                os.unlink(temp_script)
            except:
                pass
            
            if os.path.exists(output_path):
                result["image_path"] = output_path
            else:
                result["error"] = f"Execution completed but no image produced. stdout: {process.stdout}, stderr: {process.stderr}"
                
        except subprocess.TimeoutExpired:
            result["error"] = "Matplotlib execution timed out (60s)"
        except Exception as e:
            result["error"] = f"Local execution failed: {str(e)}"
        
        return result
    
    def _prepare_code_for_execution(self, code: str, output_path: str) -> str:
        """Prepare matplotlib code for headless execution."""
        lines = code.split('\n')
        modified_lines = []
        
        backend_added = False
        imports_done = False
        
        for line in lines:
            if not backend_added and ('matplotlib' in line or 'plt' in line):
                if 'import' in line:
                    modified_lines.append("import matplotlib")
                    modified_lines.append("matplotlib.use('Agg')  # Non-interactive backend")
                    backend_added = True
            
            if 'plt.show()' in line:
                safe_path = output_path.replace('\\', '/')
                modified_lines.append(f"plt.savefig('{safe_path}', dpi=150, bbox_inches='tight')")
                modified_lines.append("plt.close()")
                continue
            
            if '.show()' in line and 'fig' in line:
                safe_path = output_path.replace('\\', '/')
                modified_lines.append(f"plt.savefig('{safe_path}', dpi=150, bbox_inches='tight')")
                modified_lines.append("plt.close()")
                continue
                
            modified_lines.append(line)
        
        has_savefig = any('savefig' in line for line in modified_lines)
        if not has_savefig:
            safe_path = output_path.replace('\\', '/')
            modified_lines.append(f"\nplt.savefig('{safe_path}', dpi=150, bbox_inches='tight')")
            modified_lines.append("plt.close()")
        
        return '\n'.join(modified_lines)
