export default function BackgroundOrbs() {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
      <div className="orb bg-blue-200 w-[500px] h-[500px] top-[-100px] left-[-100px]"></div>
      <div
        className="orb bg-purple-200 w-[400px] h-[400px] bottom-[-50px] right-[-50px]"
        style={{ animationDelay: "-5s" }}
      ></div>
      <div
        className="orb bg-gray-200 w-[300px] h-[300px] top-[40%] left-[30%]"
        style={{ animationDelay: "-10s" }}
      ></div>
    </div>
  );
}
