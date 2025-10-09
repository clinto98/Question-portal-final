import React from 'react';
import Lottie from "lottie-react";
import animationData from "../assets/Books stack.json";

const Loader = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <Lottie 
        animationData={animationData} 
        loop={true} 
        autoplay={true} 
      />
    </div>
  );
};

export default Loader;