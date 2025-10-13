import { FaDiscord, FaTwitter, FaYoutube, FaMedium } from "react-icons/fa";

const socialLinks = [
  { href: "https://discord.com", icon: <FaDiscord />, label: "Discord" },
  { href: "https://twitter.com", icon: <FaTwitter />, label: "Twitter" },
  { href: "https://youtube.com", icon: <FaYoutube />, label: "YouTube" },
  { href: "https://medium.com", icon: <FaMedium />, label: "Medium" },
];

const Footer = () => {
  return (
    <footer className="w-full font-general bg-gray-900 text-white py-10">
      <div className="container mx-auto flex flex-col gap-10 px-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold font-VeniteAdoremus-regular">
           Samantha
          </h2>
          <p className="text-sm font-general text-blue-50 max-w-xs">
          Stay ahead of the game with live English Premier League stats streamed directly to the blockchain through Chainlink oracles. Every goal, assist, and final whistle is verified — no delays, no manipulation.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h3 className="mb-2 font-semibold text-violet-200">Quick Links</h3>
          <a href="/" className="hover:underline hover:text-white">
            Home
          </a>
          <a href="/prologue" className="hover:underline hover:text-white">
            About
          </a>
          <a href="/vault" className="hover:underline hover:text-white">
            Features
          </a>
          <a
            href="#privacy-policy"
            className="hover:underline hover:text-white"
          >
            Privacy Policy
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-violet-200">Connect with us</h3>
          <div className="flex gap-4">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-violet-300 hover:text-white transition-colors duration-300 text-lg"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-10 border-t border-gray-400 pt-4 text-center text-xs text-blue-50">
        © sexylabs 2025. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
