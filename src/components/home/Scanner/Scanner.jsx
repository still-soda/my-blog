import { useEffect } from 'react';
import './Scanner.css';
import { useRef } from 'react';

function easeInOutQuart(x) {
   x = x > 1 ? 1 : x < 0 ? 0 : x;
   return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export default function Scanner({ front, back }) {
   const frontScreen = useRef(null);
   const container = useRef(null);
   const hasInit = useRef(false);

   useEffect(() => {
      if (hasInit.current) return;
      hasInit.current = true;

      const currentPos = { x: 0, y: 0 };
      const targetPos = { x: 0, y: 0 };
      let lastUpdateTime = new Date().getTime();
      let radius = 10;
      const minRadius = 10;
      const maxRadius = 100;

      window.addEventListener('mousemove', handleMouseMove);
      function handleMouseMove(e) {
         targetPos.x = e.clientX;
         targetPos.y = e.clientY;
      }

      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      function handleTouchMove(e) {
         e.preventDefault();
         targetPos.x = e.touches[0].clientX;
         targetPos.y = e.touches[0].clientY;
      }

      let moveUpdateFlag = true;
      const moveUpdate = () => {
         moveUpdateFlag && requestAnimationFrame(moveUpdate);

         const currentTime = new Date().getTime();
         const dt = (currentTime - lastUpdateTime) / 1000;
         lastUpdateTime = currentTime;

         const dx = targetPos.x - currentPos.x;
         const dy = targetPos.y - currentPos.y;

         if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;

         currentPos.x += dx * dt * 10;
         currentPos.y += dy * dt * 10;
      };
      moveUpdate();

      // 根据按下时间缩放
      let press = false;
      let stateStartTime = Date.now();
      let scaleUpdateFlag = true;

      const scaleUpdate = () => {
         scaleUpdateFlag && requestAnimationFrame(scaleUpdate);

         const stateDuration = Date.now() - stateStartTime;
         const diff = maxRadius - minRadius;
         const offset = Math.abs(radius - press ? minRadius : maxRadius);
         const delta = stateDuration * (offset / diff) * 0.03;
         const percent = delta / diff;

         if (press) {
            const idealRadius = radius + easeInOutQuart(percent) * diff;
            radius = Math.max(Math.min(idealRadius, maxRadius), minRadius);
         } else {
            const idealRadius = radius - easeInOutQuart(percent) * diff;
            radius = Math.max(Math.min(idealRadius, maxRadius), minRadius);
         }

         const { top } = container.current.getBoundingClientRect();

         frontScreen.current.style.clipPath = `circle(${radius}px at ${
            currentPos.x
         }px ${currentPos.y - top}px)`;
      };
      scaleUpdate();

      window.addEventListener('mousedown', handleMouseDown);
      function handleMouseDown() {
         press = true;
         stateStartTime = Date.now();
         frontScreen.current.classList.add('active');
      }

      window.addEventListener('mouseup', handleMouseUp);
      function handleMouseUp() {
         press = false;
         stateStartTime = Date.now();
         frontScreen.current.classList.remove('active');
      }

      window.addEventListener('mouseleave', handleMouseLeave);
      function handleMouseLeave() {
         press = false;
         stateStartTime = Date.now();
         frontScreen.current.classList.remove('active');
      }

      window.addEventListener('touchstart', handleTouchStart);
      function handleTouchStart() {
         press = true;
         stateStartTime = Date.now();
         frontScreen.current.classList.toggle('active');
      }

      window.addEventListener('touchend', handleTouchEnd);
      function handleTouchEnd() {
         press = false;
         stateStartTime = Date.now();
         frontScreen.current.classList.toggle('active');
      }
   }, []);

   return (
      <div className='container' ref={container} data-id='scanner'>
         <div className='back-screen'>{back}</div>
         <div className='front-screen' ref={frontScreen}>
            {front}
         </div>
      </div>
   );
}
