import sys
import time
import threading
import itertools

class Spinner:
    """Terminal loading animation with timer for user feedback during blocking operations."""
    
    def __init__(self, message="Processing", delay=0.1):
        self.spinner = itertools.cycle(['|', '/', '-', '\\'])
        self.delay = delay
        self.message = message
        self.running = False
        self.spinner_thread = None
        self.start_time = 0

    def spin(self):
        while self.running:
            elapsed = time.time() - self.start_time
            sys.stdout.write(f"\r{next(self.spinner)} {self.message} ({elapsed:.1f}s)   ")
            sys.stdout.flush()
            time.sleep(self.delay)

    def __enter__(self):
        self.running = True
        self.start_time = time.time()
        self.spinner_thread = threading.Thread(target=self.spin)
        self.spinner_thread.start()
        return self

    def __exit__(self, exc_type, exc_value, exc_traceback):
        self.running = False
        if self.spinner_thread:
            self.spinner_thread.join()
        
        elapsed = time.time() - self.start_time
        sys.stdout.write(f"\r✅ {self.message} Done in {elapsed:.2f}s   \n")
        sys.stdout.flush()
