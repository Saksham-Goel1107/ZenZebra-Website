'use client'
import { motion } from "framer-motion"
import TickerItem from "./TickerItem"


function Ticker() {

    const UpperTicker = [
        {src:'/1.png', alt: "Brand logo"},
        {src:'/2.png', alt: "Brand logo"},
        {src:'/3.png', alt: "Brand logo"},
        {src:'/4.png', alt: "Brand logo"},
        {src:'/5.png', alt: "Brand logo"},
        {src:'/6.png', alt: "Brand logo"},
        {src:'/7.png', alt: "Brand logo"},
        {src:'/8.png', alt: "Brand logo"},
        {src:'/9.png', alt: "Brand logo"},
        {src:'/10.png', alt: "Brand logo"},
        {src:'/11.png', alt: "Brand logo"},
        {src:'/12.png', alt: "Brand logo"},
        {src:'/13.png', alt: "Brand logo"},
        {src:'/14.png', alt: "Brand logo"},
    ]

    const lowerTicker = [
        {src:'/15.png', alt: "Brand logo"},
        {src:'/16.png', alt: "Brand logo"},
        {src:'/17.png', alt: "Brand logo"},
        {src:'/18.png', alt: "Brand logo"},
        {src:'/19.png', alt: "Brand logo"},
        {src:'/20.png', alt: "Brand logo"},
        {src:'/21.png', alt: "Brand logo"},
        {src:'/22.png', alt: "Brand logo"},
        {src:'/23.png', alt: "Brand logo"},
        {src:'/24.png', alt: "Brand logo"},
        {src:'/25.png', alt: "Brand logo"},
        {src:'/26.png', alt: "Brand logo"},
        {src:'/27.png', alt: "Brand logo"},
        {src:'/28.png', alt: "Brand logo"},
    ]
  return (
    <div  className="container mx-auto">
        <TickerItem images={UpperTicker} to="-100%"/>
        <TickerItem images={lowerTicker} to="0%"/>
    </div>
  )
}

export default Ticker