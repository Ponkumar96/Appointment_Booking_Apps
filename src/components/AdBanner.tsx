import React from "react";

interface AdBannerProps {
  height?: string;
  text?: string;
  subtext?: string;
}

export default function AdBanner({
  height = "h-32",
  text = "Advertisement",
  subtext = "Monetization Space",
}: AdBannerProps) {
  return (
    <div
      className={`${height} border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center rounded-2xl`}
    >
      <div className="text-center text-gray-500">
        <p className="font-semibold text-base">{text}</p>
        <p className="text-sm opacity-70">{subtext}</p>
      </div>
    </div>
  );
}