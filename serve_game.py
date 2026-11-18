from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


GAME_DIR = Path(__file__).resolve().parent


class GameRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(GAME_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/" or self.path.startswith("/?"):
            self.path = "/index.html"
        super().do_GET()


server = ThreadingHTTPServer(("127.0.0.1", 0), GameRequestHandler)
url = f"http://127.0.0.1:{server.server_port}/index.html"
print(f"Game dang chay tai {url}", flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
