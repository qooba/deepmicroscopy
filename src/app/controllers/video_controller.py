from aiohttp import web
import asyncio
import sys
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer
from services.video import VideoTracker, Camera
from services.storage import Storage
import json
from controllers.controller import routes, Controller

class VideoController(Controller):
    def __init__(self, video_tracker: VideoTracker, storage: Storage, camera: Camera):
        super().__init__()
        self.video_tracker=video_tracker
        self.storage=storage
        self.camera=camera
        self.pcs = set()

    @routes.post("/api/video/capture")
    async def capture(self, request):
        data=await request.json()
        bucket_name=data['bucketName']
        object_name=data['objectName']
        content_type=data['contentType']
        value = self.camera.capture_image()
        self.storage.put_object(bucket_name,object_name,value,'text/plain')
        return self.json(data)

    async def offer(self, request):
        params = await request.json()
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

        pc = RTCPeerConnection()
        self.pcs.add(pc)

        @pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            print("ICE connection state is %s" % pc.iceConnectionState)
            if pc.iceConnectionState == "failed":
                await pc.close()
                self.pcs.discard(pc)

        await pc.setRemoteDescription(offer)
        pc.addTrack(self.video_tracker.prepare())

        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return web.Response(
            content_type="application/json",
            text=json.dumps(
                {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
            ),
        )


    async def on_shutdown(self, app):
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros)
        self.pcs.clear()

