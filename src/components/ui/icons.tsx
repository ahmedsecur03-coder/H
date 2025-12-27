
import * as React from "react"

export const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);


export const MetaPartnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 140 40" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g transform="scale(0.8) translate(5, 5)">
            <defs>
                <linearGradient id="meta-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8a2be2" />
                    <stop offset="50%" stopColor="#4169e1" />
                    <stop offset="100%" stopColor="#0000ff" />
                </linearGradient>
            </defs>
            <path d="M36.3,20.3c0-3.3,2.7-6,6-6s6,2.7,6,6c0,2.1-1.1,4-2.8,5.1l-3.2,2.1l3.2,2.1c1.7,1.1,2.8,3,2.8,5.1c0,3.3-2.7,6-6,6s-6-2.7-6-6c0-2.1,1.1-4,2.8-5.1l3.2-2.1l-3.2-2.1C37.4,24.3,36.3,22.4,36.3,20.3z M20.4,6.3c-7,0-12.7,5.7-12.7,12.7c0,5.9,4.1,11,9.6,12.4v-8.8H14v-7.2h3.3v-5.4c0-3.3,2-6.4,6.2-6.4l6,0v7h-3.6c-1.6,0-1.9,0.7-1.9,1.8v4.4h5.3l-0.7,7.2h-4.6v13.6c7.1-1.3,12.6-7.5,12.6-14.7C42.8,12,32.4,6.3,20.4,6.3z" fill="url(#meta-grad)"/>
        </g>
        <text x="75" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">PARTNER</text>
    </svg>
);

export const GooglePartnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 140 40" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g transform="translate(10, 8) scale(0.4)">
            <path fill="#4285F4" d="M96.8,51.3c0-3.2-0.3-6.4-0.8-9.5H50v17.9h26.3c-1.1,5.8-4.3,10.8-9.3,14.1v11.6h15c8.8-8.1,13.8-20,13.8-34.1z" />
            <path fill="#34A853" d="M50,100c13.4,0,24.8-4.4,33.1-11.9l-15-11.6c-4.4,3-10,4.8-18.1,4.8c-13.8,0-25.5-9.3-29.7-21.9H4.2v12 C10,91.8,28.3,100,50,100z" />
            <path fill="#FBBC05" d="M20.3,64.2c-0.8-2.4-1.3-4.9-1.3-7.5s0.4-5.1,1.3-7.5V37.2H4.2c-2.8,5.6-4.2,11.8-4.2,18.5 c0,6.7,1.4,12.9,4.2,18.5L20.3,64.2z" />
            <path fill="#EA4335" d="M50,19.8c7.3,0,12.9,3.1,15.9,6l13.2-13.2C69.7,3.6,58.3,0,50,0C28.3,0,10,8.2,4.2,26.8l16.1,12.5 C24.5,29.1,36.2,19.8,50,19.8z" />
        </g>
        <text x="80" y="25" fontFamily="Arial, sans-serif" fontSize="12" fill="currentColor" fontWeight="bold">Partner</text>
    </svg>
);

export const TikTokPartnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="tiktok-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2ea" />
                <stop offset="100%" stopColor="#ff0050" />
            </linearGradient>
        </defs>
        <g transform="scale(0.35) translate(15, -2)">
            <path d="M62.6,3C67.8,2.9,73,3,78.2,2.9c0.3,6,2.5,12.2,6.8,16.4c4.4,4.4,10.6,6.4,16.6,7v15.8 c-5.6-0.2-11.3-1.4-16.4-3.8c-2.2-1-4.3-2.3-6.3-3.6c0,11.5,0,23,0,34.5c-0.3,5.5-2.1,11-5.3,15.5c-5.1,7.6-14,12.5-23.1,12.6 c-5.6,0.3-11.2-1.2-16-4.1c-7.9-4.7-13.5-13.3-14.3-22.5V61.8c3.2,0.3,6.5,0.6,9.7,0.8c0.1-6.2,0-12.5,0-18.7 c-0.1-4.7-1.7-9.3-4.4-13.1c-5.1-7.2-13.9-11-22.4-9.9V26c5.6,0.1,11.3,1.3,16.4,3.6c2.2,1,4.3,2.2,6.3,3.6c0-11.5,0-23,0-34.5H62.6z" fill="url(#tiktok-grad)"/>
        </g>
        <text x="80" y="25" fontFamily="Arial, sans-serif" fontSize="7" fill="currentColor" fontWeight="bold">MARKETING PARTNER</text>
    </svg>
);

export const SnapchatPartnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 35" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="100%" height="100%" fill="black" rx="5" />
    <g transform="translate(15, 0) scale(0.35)">
      <path fill="#FFFC00" d="M68.7,39.3c-0.3-4.2-1.9-8.3-4.8-11.4c-4-4.2-9.2-6.5-14.7-6.5c-5.4,0-10.7,2.3-14.7,6.5 c-2.9,3.1-4.5,7.2-4.8,11.4c-0.1,0.8-0.1,1.7-0.1,2.5c0,1.3,0.1,2.6,0.4,3.9c0.3,1.3,0.8,2.6,1.4,3.8 c-0.8,0.7-1.5,1.5-2.1,2.3c-1.3,1.7-2.3,3.7-3,5.8c-0.7,2.1-1,4.3-1,6.5c0,0.4,0,0.8,0.1,1.2h47.4c0.1-0.4,0.1-0.8,0.1-1.2 c0-2.2-0.3-4.4-1-6.5c-0.7-2.1-1.7-4.1-3-5.8c-0.6-0.8-1.3-1.6-2.1-2.3c0.6-1.2,1.1-2.4,1.4-3.8C68.6,41.9,68.7,40.6,68.7,39.3z" />
    </g>
    <text x="68" y="19" fontFamily="Arial, sans-serif" fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">AGENCY</text>
    <text x="68" y="29" fontFamily="Arial, sans-serif" fontSize="7" fill="white" textAnchor="middle" fontWeight="bold">PARTNER</text>
  </svg>
);
