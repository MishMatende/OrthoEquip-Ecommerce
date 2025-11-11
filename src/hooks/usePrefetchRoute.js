import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function usePrefetchRoute(path, importFunc) {
  useEffect(() => {
    const link = document.querySelector(`a[href='${path}']`);
    if (!link) return;

    const handleMouseEnter = () => importFunc();
    link.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [path, importFunc]);
}
