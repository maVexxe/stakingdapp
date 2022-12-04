import Head from "next/head";
import Navigation from "../components/Navbar";
import Tabs from "../components/Tabs";
import Footer from "../components/Footer";
import ConnectWalletModal from "../components/ConnectWalletModal";
export function App() {
  return (
    <>
      <ConnectWalletModal />
      <Head>
        <title>Manifold Finance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Navigation />
      <Tabs />
      <Footer />
    </>
  );
}

export default App;
