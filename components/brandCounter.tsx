import CountUp from "./countUp";


export default function BrandCounter() {
  return (
    <p className="relative text-center text-white/70 text-2xl mt-20">
      Trusted by <CountUp to={250} duration={1.2} suffix="+" /> brands
    </p>
  )
}
