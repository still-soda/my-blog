import { useEffect, useRef } from 'react';
import './MagicAvatar.css';

export default function MagicAvatar() {
   const canvas = useRef(null);
   const hasInit = useRef(false);

   useEffect(() => {
      if (hasInit.current) return;
      hasInit.current = true;

      const ctx = canvas.current.getContext('2d');

      const size = { x: 80, y: 80 };
      const itemSize = { x: 0, y: 0 };
      const gap = 0;
      const canvasSize = { x: 400, y: 400 };
      const imageSize = { x: 200, y: 200 };

      async function drawImage() {
         const image = new Image();
         let resolver = null;
         const loadedPromise = new Promise((resolve) => {
            resolver = resolve;
         });

         image.onload = () => {
            canvas.current.width = canvasSize.x;
            canvas.current.height = canvasSize.y;
            itemSize.x = canvasSize.x / size.x;
            itemSize.y = canvasSize.y / size.y;
            ctx.drawImage(
               image,
               (canvasSize.x - imageSize.x) / 2,
               (canvasSize.y - imageSize.y) / 2,
               imageSize.x,
               imageSize.y
            );
            resolver();
         };
         image.src = './avatar.jpg';
         await loadedPromise;
      }

      function getPointsData(blend = false) {
         const pointsData = [];

         const blockSize = {
            x: canvasSize.x / size.x,
            y: canvasSize.y / size.y,
         };
         const center = { x: canvasSize.x / 2, y: canvasSize.y / 2 };

         for (let i = 0; i < size.x; i++) {
            for (let j = 0; j < size.y; j++) {
               const imageData = ctx.getImageData(
                  i * blockSize.x,
                  j * blockSize.y,
                  blockSize.x,
                  blockSize.y
               );

               let r = 0,
                  g = 0,
                  b = 0,
                  a = 0;

               if (blend) {
                  for (let k = 0; k < imageData.data.length; k += 4) {
                     r += imageData.data[k];
                     g += imageData.data[k + 1];
                     b += imageData.data[k + 2];
                     a += imageData.data[k + 3];
                  }

                  const pixelCount = blockSize.x * blockSize.y;

                  r = Math.floor(r / pixelCount);
                  g = Math.floor(g / pixelCount);
                  b = Math.floor(b / pixelCount);
               } else {
                  r = imageData.data[0];
                  g = imageData.data[1];
                  b = imageData.data[2];
                  a = imageData.data[3];
               }

               const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
               const x = i * blockSize.x + blockSize.x / 2;
               const y = j * blockSize.y + blockSize.y / 2;

               const dist = Math.hypot(x - center.x, y - center.y);
               if (dist > imageSize.x / 2) {
                  continue;
               }

               pointsData.push({
                  x,
                  y,
                  r,
                  g,
                  b,
                  a,
                  size: itemSize.x * (Math.max(0.2, luminance / 255) + 0.3),
                  disrupted: false,
               });
            }
         }

         return pointsData;
      }

      function render(data) {
         ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
         const center = { x: canvasSize.x / 2, y: canvasSize.y / 2 };
         data.forEach((point) => {
            const dist = Math.hypot(point.x - center.x, point.y - center.y);
            ctx.beginPath();
            ctx.arc(point.x, point.y, (point.size - gap) / 2, 0, 2 * Math.PI);
            ctx.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b}, ${
               point.a * (dist / canvasSize.x / 2)
            })`;
            ctx.fill();
         });
      }

      let renderFlag = true;
      let renderData = null;
      let mousePos = { x: 0, y: 0 };
      const disruptDistance = 40;
      function addMouseAction(sourceData) {
         const currentData = structuredClone(sourceData);
         let pressed = false;

         window.addEventListener('mousedown', () => {
            pressed = true;
         });

         window.addEventListener('mouseup', () => {
            pressed = false;
         });

         function handleMove(e) {
            const { x, y } = getMousePos(e);
            mousePos = { x, y };
            if (pressed) return;
            currentData.forEach((point, idx) => {
               if (point.disrupted) return;
               const dist = Math.hypot(point.x - x, point.y - y);
               const range = 150;
               if (dist < disruptDistance) {
                  const sourcePoint = sourceData[idx];
                  point.x += Math.random() * range - range / 2;
                  point.y += Math.random() * range - range / 2;

                  point.timer ?? clearTimeout(point.timer);
                  point.disrupted = true;
                  const timer = setTimeout(() => {
                     returnUpdate(
                        point,
                        { x: sourcePoint.x, y: sourcePoint.y },
                        1500
                     );
                  }, 200);
                  point.timer = timer;
               }
            });
         }

         canvas.current.addEventListener('mousemove', (e) => {
            handleMove(e);
         });

         canvas.current.addEventListener('touchmove', (e) => {
            handleMove(e);
         });

         function returnUpdate(
            point,
            targetPos,
            duration,
            startTime = Date.now()
         ) {
            const currentTime = Date.now();
            const percent = (currentTime - startTime) / duration;
            const dist2mouse = Math.hypot(
               targetPos.x - mousePos.x,
               targetPos.y - mousePos.y
            );
            if (dist2mouse < disruptDistance) {
               startTime = currentTime;
               requestAnimationFrame(() =>
                  returnUpdate(point, targetPos, duration, startTime)
               );
               point.disrupted = false;
               return;
            }
            if (percent >= 0.8) {
               point.x = targetPos.x;
               point.y = targetPos.y;
               point.disrupted = false;
               return;
            }
            point.x = point.x + (targetPos.x - point.x) * percent;
            point.y = point.y + (targetPos.y - point.y) * percent;
            requestAnimationFrame(() =>
               returnUpdate(point, targetPos, duration, startTime)
            );
         }

         function getMousePos(e) {
            const rect = canvas.current.getBoundingClientRect();
            if (e.touches) {
               return {
                  x: e.touches[0].clientX - rect.left,
                  y: e.touches[0].clientY - rect.top,
               };
            } else {
               return {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
               };
            }
         }

         renderData = currentData;

         canvas.current.addEventListener('mouseenter', () => {
            renderFlag = true;
         });
      }

      const update = (render) => {
         requestAnimationFrame(() => update(render));
         render(renderData);
      };

      init();
      async function init() {
         await drawImage();
         const imgPointsData = getPointsData(true);

         renderData = imgPointsData;
         render(imgPointsData);
         addMouseAction(imgPointsData);
         update(() => {
            renderFlag && renderData && render(renderData);
         });
      }
   }, []);

   return (
      <div className='container' data-id='magic-avatar'>
         <canvas ref={canvas}></canvas>
      </div>
   );
}
