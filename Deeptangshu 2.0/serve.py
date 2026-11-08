import http.server, os

PORT = 8001   # a new port, so an old server still running on 8000 cannot get in the way

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

print("Serving this folder:", os.getcwd())
try:
    txt = open("index.html", encoding="utf-8").read()
    print("index.html is the NEW version:", "v6-book" in txt)
except FileNotFoundError:
    print("There is NO index.html in this folder!")
print("Files here:", os.listdir("."))
print("Now open  http://localhost:%d  in your browser. Press Ctrl+C to stop." % PORT)
http.server.ThreadingHTTPServer(("", PORT), NoCache).serve_forever()
