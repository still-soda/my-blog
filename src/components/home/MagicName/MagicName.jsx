import { useEffect, useRef, useState } from 'react';
import NameIcon from '../components/NameIcon';
import './MagicName.css';

export default function MagicName() {
   const svg = useRef(null);
   const [isTransparent, setIsTransparent] = useState(true);

   useEffect(() => {
      setIsTransparent(false);

      // 设置dashoffset
      const path = svg.current.querySelectorAll('path');
      path.forEach((p) => {
         const length = p.getTotalLength();
         p.style.strokeDasharray = length;
         p.style.strokeDashoffset = length;
      });

      requestAnimationFrame(() => {
         const delay = [0.5, 1.5, 2.3, 2.6, 2.9];
         const duration = [2, 0.5, 0.3, 0.1, 1.5];
         path.forEach((p, idx) => {
            p.style.transition = `stroke-dashoffset ${duration[idx]}s ease-in-out`;
            p.style.transitionDelay = `${delay[idx]}s`;
            p.style.strokeDashoffset = 0;
         });
      });
   }, []);

   return (
      <div
         className='container'
         data-id='magic-name'
         style={{ opacity: isTransparent ? 0 : 1 }}>
         <NameIcon ref={svg} />
      </div>
   );
}
