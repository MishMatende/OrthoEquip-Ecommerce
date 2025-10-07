import React from "react";
import Navbar from "./Navbar";
import Header from "./Header";
import ProdcutShowCase from "./ProdcutShowCase";
import Card from "./Card";

export default function Home() {
  return (
    <>
      <Header />
      <Navbar />
      <ProdcutShowCase />
      <h1>Featured Products</h1>
      <Card />
    </>
  );
}
