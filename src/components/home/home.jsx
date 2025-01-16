import MagicAvatar from './MagicAvatar/MagicAvatar';
import MagicName from './MagicName/MagicName';
import Scanner from './Scanner/Scanner';
import './home.css';

function Back() {
   return (
      <div className='back' data-id='home-first'>
         <MagicAvatar />
         <MagicName />
         <div></div>
      </div>
   );
}

function Front() {
   return (
      <div className='front' data-id='home-first'>
         <img src='avatar.jpg' alt='' />
         <div
            style={{
               color: 'white',
               whiteSpace: 'nowrap',
            }}>
            没有气的汽水
         </div>
      </div>
   );
}

const Banner = (options) => {
   const {
      parentClass = '',
      childClass = 'text-4xl opacity-50',
      duration = 4,
      width = '20rem',
      text = 'DEVELOPER',
      direction = 'right',
      childWidth = '16rem',
      childCount = 4,
   } = options;
   return (
      <div className={`absolute ${parentClass}`}>
         <div
            className={`text-[#ffa652] font-bold flex gap-8 font-jetbrains rolling ${childClass}`}
            style={{
               filter: 'drop-shadow(0 0 0.5rem #ffa652)',
               animationDuration: `${duration}s`,
               '--width': width,
            }}>
            {[...Array(childCount)].map((_, idx) => (
               <span className={`flex`} style={{ width: childWidth }} key={idx}>
                  {text}
                  <i className={`fas ml-6 blink fa-angle-${direction}`}></i>
                  <i
                     className={`fas blink fa-angle-${direction}`}
                     style={{ animationDelay: '0.5s' }}></i>
               </span>
            ))}
         </div>
      </div>
   );
};

export default function Home() {
   return (
      <div className='h-screen relative w-screen justify-center flex'>
         <div className='absolute w-screen h-screen flex pointer-events-none overflow-hidden opacity-50'>
            <Banner
               parentClass='rotate-[25deg] -right-96 -top-10 md:top-28'
               childClass='text-6xl opacity-80'
               width='28rem'
               text='DEVELOPER'
               direction='right'
               childWidth='26rem'
               childCount={4}
            />
            <Banner
               parentClass='rotate-[45deg] -right-72 top-4 md:top-28'
               childClass='text-4xl opacity-20'
               duration={6}
               width='18rem'
               text='DEVELOPER'
               direction='right'
               childWidth='16rem'
               childCount={4}
            />
            <Banner
               parentClass='-rotate-[50deg] -right-[36rem] md:-right-[36rem] bottom-[-2.5rem] md:bottom-[9rem]'
               childClass='text-6xl opacity-50'
               duration={8}
               width='-22rem'
               text='PLAYER'
               direction='left'
               childWidth='20rem'
               childCount={5}
            />
            <Banner
               parentClass='-rotate-[20deg] -right-72 bottom-20 md:bottom-24'
               childClass='text-3xl opacity-20'
               duration={6}
               width='15rem'
               text='DEVELOPER'
               direction='right'
               childWidth='13rem'
               childCount={5}
            />
            <Banner
               parentClass='rotate-[55deg] -left-96 -bottom-72 md:bottom-16'
               childClass='text-6xl opacity-80'
               duration={6}
               width='-25rem'
               text='DESIGNER'
               direction='left'
               childWidth='23rem'
               childCount={4}
            />
            <Banner
               parentClass='-rotate-[60deg] -left-80 -top-[10rem] md:top-28'
               childClass='text-5xl opacity-30'
               duration={8}
               width='-18rem'
               text='DESIGN'
               direction='left'
               childWidth='16rem'
               childCount={5}
            />
            <Banner
               parentClass='-rotate-[30deg] -left-96 md:-left-80 top-2 md:top-28'
               childClass='text-6xl opacity-50'
               duration={4}
               width='-22rem'
               text='PLAYER'
               direction='left'
               childWidth='20rem'
               childCount={4}
            />
            <Banner
               parentClass='rotate-[25deg] -left-80 bottom-2 md:bottom-32'
               childClass='text-4xl opacity-20'
               duration={6}
               width='18rem'
               text='DEVELOPER'
               direction='right'
               childWidth='16rem'
               childCount={5}
            />
         </div>
         <Scanner front={<Front />} back={<Back />} />
         <div className='crt-effetion '></div>
      </div>
   );
}
