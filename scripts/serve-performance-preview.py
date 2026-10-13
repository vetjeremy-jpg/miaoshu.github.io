"""Loopback-only preview with the public site's ten-minute HTTP cache policy."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class PreviewHandler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'public, max-age=600')
        super().end_headers()

    def log_message(self, *_args):
        pass

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, required=True)
parser.add_argument('--directory', required=True)
args = parser.parse_args()
ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=args.directory)).serve_forever()
