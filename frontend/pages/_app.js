import "../styles/globals.css";
import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { getFriendlyError } from "@/lib/errorMessages";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const onUnhandledRejection = (event) => {
      const friendly = getFriendlyError(event?.reason, "Something unexpected happened. Please try again.");
      toast.error(friendly);
      event.preventDefault();
    };

    const onWindowError = () => {
      toast.error("Something unexpected happened. Please refresh and try again.");
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            border: "1px solid #d3cec4",
            background: "#fbfaf6",
            color: "#1a1a16",
          },
          success: {
            duration: 2800,
          },
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={router.asPath}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
