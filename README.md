## Dummy Server for smoother front-end development

> When in a team, front-end and back-end development goes together, many times the front-end people have to wait for apis from back-end so that they can do the integration and finish their work. It can get a bit frustrating to keep waiting or bugging them for server endpoints.

This is a simple **express server** that would have the same endpoints as the actual back-end server that would be used in production. These endpoints will simply return dummy responses that would have the same json response structure as the responses from the actual production server (Assuming the back-end people have provided the would-be endpoints and json response structures)

## Setup

- You need mongodb running in the server instance that you'll be using this. 
- Create a db and set the db name in `server.js` where connection is made with the mongoclient
- Make the required changes in the port and URIs.
- Simply run `node server.js` in the project root directory
