import json
import os

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado.web import StaticFileHandler

class EnvRouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "notebookType": os.environ.get('NOTEABLE_NOTEBOOK_TYPE', 'Default Notebook'),
            "iconTypeUrl": os.environ.get('NOTEABLE_NOTEBOOK_ICON', "https://noteable.edina.ac.uk/images/programmers.svg")
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    route_pattern = url_path_join(base_url, "jupyterlab_apod", "env")
    handlers = [(route_pattern, EnvRouteHandler)]
    web_app.add_handlers(host_pattern, handlers)

