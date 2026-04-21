
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DropdownMessage from './DropdownMessage';
import DropdownNotification from './DropdownNotification';
import DropdownUser from './DropdownUser';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from './DarkModeSwitcher';

const brands = [
  { name: 'Echo', logo: '/images/echo.png' },
  { name: 'Shindaiwa', logo: '/images/Shindaiwa.png' },
  { name: 'Scag', logo: '/images/scag.png' },
  { name: 'Toro', logo: '/images/toro.png' },
  { name: 'Hustler', logo: '/images/hulster.png' },
  { name: 'RedMax', logo: '/images/redmax.png' },
  { name: 'STIHL', logo: '/images/stihl.png' },
  { name: 'BE', logo: '/images/be.png' },
  { name: 'Billy Goat', logo: '/images/billygoat.png' },
  { name: 'Husqvarna', logo: '/images/husqvarna.png' },
  //{ name: 'Kawasaki', logo: '/images/kawasaki.png' },
  { name: 'Kohler', logo: '/images/kohler.png' },
  { name: 'Murray', logo: '/images/murray.png' },
  { name: 'Snapper', logo: '/images/snapper.png' },
  { name: 'YBravo', logo: '/images/ybravo.png' },
  {name: 'Exmark', logo: '/images/exmark.png' },
];

const ITEMS_PER_PAGE = 7;

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % brands.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [paused]);

  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + brands.length) % brands.length);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % brands.length);

  const visibleBrands = Array.from({ length: ITEMS_PER_PAGE }, (_, i) =>
    brands[(currentIndex + i) % brands.length]
  );

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* <!-- Hamburger Toggle BTN --> */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && '!w-full delay-300'
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && 'delay-400 !w-full'
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && '!w-full delay-500'
                  }`}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && '!h-0 !delay-[0]'
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && '!h-0 !delay-200'
                  }`}
                ></span>
              </span>
            </span>
          </button>
          {/* <!-- Hamburger Toggle BTN --> */}

          <Link className="block flex-shrink-0 lg:hidden" to="/">
            <img src={LogoIcon} alt="Logo" />
          </Link>
        </div>

        <div className="hidden sm:block">
          <form action="https://formbold.com/s/unique_form_id" method="POST">
            <div className="relative">
              <button className="absolute left-0 top-1/2 -translate-y-1/2">
                
              </button>

             
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* Marcas - Carrusel con flechas */}
            <div
              className="flex items-center gap-2 px-4"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Flecha izquierda */}
              <button
                type="button"
                onClick={goPrev}
                className="flex-shrink-0 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-boxdark-2 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 transition-colors"
                title="Anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Logos */}
              <div className="flex items-center gap-6">
                {visibleBrands.map((brand, i) => (
                  <img
                    key={`${brand.name}-${i}`}
                    src={brand.logo}
                    alt={brand.name}
                    className="h-14 max-h-16 w-auto object-contain transition-opacity duration-500"
                    style={{ maxWidth: '180px' }}
                    title={brand.name}
                  />
                ))}
              </div>

              {/* Flecha derecha */}
              <button
                type="button"
                onClick={goNext}
                className="flex-shrink-0 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-boxdark-2 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 transition-colors"
                title="Siguiente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            {/* <!-- Dark Mode Toggler --> */}
            <DarkModeSwitcher />
            {/* <!-- Dark Mode Toggler --> */}
          </ul>

          {/* <!-- User Area --> */}
          <DropdownUser />
          {/* <!-- User Area --> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
