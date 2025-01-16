import './Navigator.css';

export default function Navigator() {
   return (
      <nav
         data-id='nav'
         className='text-sm md:text-base w-[90vw] rounded-lg md:rounded-2xl md:w-[80vw]'>
         <span className='name active'>still_soda</span>
         <div className='items'>
            <span>.is()</span>
            <span className='hidden md:block'>.about()</span>
            <span className='hidden md:block'>.projects()</span>
            <span className='hidden md:block'>.contact()</span>
         </div>
      </nav>
   );
}
