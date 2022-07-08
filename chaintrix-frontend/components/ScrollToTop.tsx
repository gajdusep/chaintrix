import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}