from aiohttp import web
import logging

class WebSocketManager:
    sockets=[]

    async def send(self, message: str):
        for socket in WebSocketManager.sockets:
            try:
                await socket.send_str(message)
            except Exception as ex:
                logging.info(f'socket deleted because of exception: {ex}')
                WebSocketManager.sockets[socket]

    @staticmethod
    async def websocket_handler(request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        WebSocketManager.sockets.append(ws)
        logging.info('ws connection created')
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                if msg.data == 'close':
                    await ws.close()
                    logging.info('websocket connection closed')
                else:
                    pass
                    #await ws.send_str(msg.data + '/answer')
            elif msg.type == aiohttp.WSMsgType.ERROR:
                logging.info('ws connection closed with exception %s' %
                      ws.exception())

        logging.info('websocket connection closed')
        WebSocketManager.sockets.remove(ws)
        return ws



