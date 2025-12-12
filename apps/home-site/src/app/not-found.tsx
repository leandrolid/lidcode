import { cn } from '@ls/ui/cn'

export default function NotFound() {
  return (
    <div
      className={cn({
        'w-full h-dvh overflow-hidden flex flex-col items-center justify-center': true,
        'bg-[linear-gradient(135deg,#1a1a2e,#09090b)]': true,
      })}
      style={{
        fontFamily: "'Courier Prime', monospace",
      }}
    >
      <div className="not-found-stars">
        <div className="not-found-star" style={{ top: '10%', left: '20%', animationDelay: '0s' }} />
        <div
          className="not-found-star"
          style={{ top: '20%', left: '80%', animationDelay: '0.5s' }}
        />
        <div className="not-found-star" style={{ top: '60%', left: '30%', animationDelay: '1s' }} />
        <div
          className="not-found-star"
          style={{ top: '80%', left: '70%', animationDelay: '1.5s' }}
        />
        <div className="not-found-star" style={{ top: '40%', left: '10%', animationDelay: '2s' }} />
        <div
          className="not-found-star"
          style={{ top: '30%', left: '90%', animationDelay: '0.3s' }}
        />
      </div>
      <div className="text-center px-2">
        <h1 className="text-9xl m-0 text-[#e94560] [text-shadow:0_0_20px_#e94560,0_0_40px_#e94560] font-bold">
          404
        </h1>
        <div className="text-3xl mx-0 my-5 text-[#0f4c75] font-bold">OOPS!</div>
        <p className="text-xl mx-0 my-2.5 text-[#bbb]">Looks like this page went on vacation...</p>
        <div className="text-2xl mx-0 my-7 text-[#3282b8] italic">{`"I'm not lost, you're lost!" - This Page, probably`}</div>
        <p className="text-xl mx-0 my-2.5 text-[#bbb]">
          {`Don't worry, it happens to the best of us.`}
          <br />
          Even our URLs sometimes take unexpected detours.
        </p>
        <a
          href="https://short.lidco.de"
          className="inline-block mt-8 px-6 py-3 bg-[#3282b8] text-white rounded-full hover:bg-[#0f4c75] transition-colors duration-300"
        >
          Take Me Home
        </a>
      </div>
    </div>
  )
}
