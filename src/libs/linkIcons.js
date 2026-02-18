import {
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaXTwitter,
  FaFacebook,
  FaDiscord,
  FaLinkedin,
  FaGithub,
  FaSnapchat,
  FaTwitch,
  FaSpotify,
} from "react-icons/fa6";

export function getIconForUrl(url = "") {
  const u = (url || "").toLowerCase();

  if (u.includes("instagram.com")) return FaInstagram;
  if (u.includes("tiktok.com")) return FaTiktok;
  if (u.includes("youtube.com") || u.includes("youtu.be")) return FaYoutube;
  if (u.includes("x.com") || u.includes("twitter.com")) return FaXTwitter;
  if (u.includes("facebook.com")) return FaFacebook;
  if (u.includes("discord.gg") || u.includes("discord.com")) return FaDiscord;
  if (u.includes("linkedin.com")) return FaLinkedin;
  if (u.includes("github.com")) return FaGithub;
  if (u.includes("snapchat.com")) return FaSnapchat;
  if (u.includes("twitch.tv")) return FaTwitch;
  if (u.includes("spotify.com")) return FaSpotify;

  return FaGlobe;
}
