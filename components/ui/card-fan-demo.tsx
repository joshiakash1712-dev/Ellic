import SocialCards from "@/components/ui/card-fan-carousel";

const DEMO_CARDS = [
  { imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", alt: "Mountain landscape" },
  { imgUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80", alt: "City night" },
  { imgUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80", alt: "Foggy forest" },
  { imgUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80", alt: "Sunlit woods" },
  { imgUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", alt: "Tropical beach" },
  { imgUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", alt: "Starry mountain" },
  { imgUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=800&q=80", alt: "Golden sunset" },
  { imgUrl: "https://images.unsplash.com/photo-1439853941329-a93ac161726a?auto=format&fit=crop&w=800&q=80", alt: "Lake reflection" },
  { imgUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80", alt: "Green valley" },
  { imgUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", alt: "Sunbeam nature" },
];

export default function Demo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <SocialCards cards={DEMO_CARDS} />
    </div>
  );
}
export { Demo as CardFanDemo, DEMO_CARDS };
