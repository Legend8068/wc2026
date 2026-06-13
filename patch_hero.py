import re

with open('src/components/Hero.jsx', 'r') as f:
    content = f.read()

interactive_map_code = """
function InteractiveHeroMap() {
  const mapRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (!mapRef.current) return;
    const { left, top, width, height } = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    const rotateX = (0.5 - y) * 30;
    const rotateY = (x - 0.5) * 30;
    
    mapRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    mapRef.current.style.filter = `drop-shadow(${rotateY * -0.5}px ${rotateX * 0.5 + 10}px 24px rgba(51, 102, 255, 0.4))`;
  };
  
  const handleMouseLeave = () => {
    if (!mapRef.current) return;
    mapRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    mapRef.current.style.filter = '';
  };

  return (
    <div 
      ref={mapRef}
      className="hero-map-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.1s ease-out, filter 0.1s ease-out', display: 'flex', justifyContent: 'center', width: '100%' }}
    >
      <MapIcon
        className="hero-map"
        role="button"
        tabIndex={0}
        aria-label="Jump to host venues"
        title="View host venues"
        onClick={scrollToVenues}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToVenues(); } }}
        style={{ margin: 0 }}
      />
    </div>
  );
}
"""

content = content.replace("function StatNumber", interactive_map_code + "\nfunction StatNumber")

old_map = """        <MapIcon
          className="hero-map"
          role="button"
          tabIndex={0}
          aria-label="Jump to host venues"
          title="View host venues"
          onClick={scrollToVenues}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToVenues(); } }}
        />"""

content = content.replace(old_map, "        <InteractiveHeroMap />")

with open('src/components/Hero.jsx', 'w') as f:
    f.write(content)
