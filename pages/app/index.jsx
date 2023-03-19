import { useEffect, useRef } from "react";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

const App = () => {
  const ffmpeg = useRef();
  const canvasRef = useRef();
  const previewRef = useRef();

  useEffect(() => {
    (async () => {
      ffmpeg.current = createFFmpeg({
        log: true,
        corePath: `${window.location.origin}/static/v0.11.0/ffmpeg-core.js`,
      });
      ffmpeg.current.setProgress(({ ratio }) => {
        console.log(ratio);
      });
      await ffmpeg.current.load();
    })();
  }, []);

  const render = (canvas, ctx, i, len) => {
    // Calculate the progress of the animation from 0 to 1
    const t = i / len;
    // Draw the image to the canvas
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(100, 75, t * 500, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    const b64 = canvas.toDataURL("image/jpeg", 1.0);
    return Buffer.from(b64, "base64");
  }

  const generate = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // render 3 second video @ 30fps
    const len = 30*3;
    console.log(`Rendering ${len} frames`);
    for (let i = 0; i < len; i+= 1) {
      const num = `00${i}`.slice(-3);
      ffmpeg.current.FS('writeFile', `tmp.${num}.jpg`, render(canvas, ctx, i, len));
    }
    console.log("Encoding video");
    await ffmpeg.current.run('-framerate', '30', '-pattern_type', 'glob', '-i', '*.jpg', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', 'out.mp4');
    const end = Date.now();
    console.log("Cleaning up");
    const data = ffmpeg.current.FS('readFile', 'out.mp4');
    for (let i = 0; i < len; i+= 1) {
      const num = `00${i}`.slice(-3);
      ffmpeg.current.FS('unlink', `tmp.${num}.jpg`);
    }
    console.log("Finished!");
    previewRef.current.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  }

  return (
    <div className="page-app">
      <input type="button" onClick={generate} value="Generate" />
      <br />
      <br />
      <video ref={previewRef} controls></video><br/>
      <br />
      <canvas ref={canvasRef} style={{display: 'none'}} />
    </div>
  );
};
export default App;
