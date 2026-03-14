export default function GradientBackground() {
  return (
    <div
      className="absolute inset-0 w-screen h-screen overflow-hidden -z-10 bg-white"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(0,0,0,0.3) 30%, black 45%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(0,0,0,0.3) 30%, black 45%)"
      }}
    >
      {/* Noise */}
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.35" />
      </svg>

      {/* Rectangle 4959 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-32% via-[#7aa2ff] via-60% to-[#0052ff]"
        style={{ left: "0%", width: "9.7%", opacity: 0.75, boxShadow: "0px 4px 20px 14px rgba(0,82,255,0.12)" }}
      />

      {/* Rectangle 4960 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-42% via-[#5f8fff] via-62% to-[#0052ff]"
        style={{ left: "9.7%", width: "9.7%", boxShadow: "0px 4px 20px 16px rgba(0,82,255,0.13)" }}
      />

      {/* Rectangle 4961 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-54% via-[#4d82ff] via-70% to-[#0052ff]"
        style={{ left: "19.4%", width: "9.7%", boxShadow: "0px 4px 20px 17px rgba(0,82,255,0.14)" }}
      />

      {/* Rectangle 4962 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-70% to-[#0052ff]"
        style={{ left: "29.1%", width: "9.7%", boxShadow: "0px 4px 20px 18px rgba(0,82,255,0.15)" }}
      />

      {/* Rectangle 4963 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-80% to-[#0052ff]"
        style={{ left: "38.8%", width: "8.3%", boxShadow: "0px 4px 20px 18px rgba(0,82,255,0.16)" }}
      />

      {/* Rectangle 4969 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-87% to-[#0052ff]"
        style={{ left: "47.1%", width: "4.9%", boxShadow: "0px 4px 20px 18px rgba(0,82,255,0.17)" }}
      />

      {/* Rectangle 4964 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-80% to-[#0052ff]"
        style={{ left: "52%", width: "8.1%", boxShadow: "0px 4px 20px 18px rgba(0,82,255,0.16)" }}
      />

      {/* Rectangle 4965 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-70% to-[#0052ff]"
        style={{ left: "60.1%", width: "9.7%", boxShadow: "0px 4px 20px 17px rgba(0,82,255,0.15)" }}
      />

      {/* Rectangle 4966 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-54% via-[#4d82ff] via-70% to-[#0052ff]"
        style={{ left: "69.8%", width: "9.7%", boxShadow: "0px 4px 20px 17px rgba(0,82,255,0.14)" }}
      />

      {/* Rectangle 4967 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-42% via-[#5f8fff] via-62% to-[#0052ff]"
        style={{ left: "79.5%", width: "9.7%", boxShadow: "0px 4px 20px 16px rgba(0,82,255,0.13)" }}
      />

      {/* Rectangle 4968 */}
      <div
        className="absolute h-full bg-gradient-to-b from-white from-32% via-[#7aa2ff] via-60% to-[#0052ff]"
        style={{ left: "89.2%", width: "10.8%", opacity: 0.75, boxShadow: "0px 4px 20px 14px rgba(0,82,255,0.12)" }}
      />
    </div>
  );
}