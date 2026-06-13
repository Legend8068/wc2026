import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Replace hm-map block
old_hm_map = """.hm-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  fill: url(#hm-grad);
  filter: drop-shadow(0 0 20px rgba(0, 243, 255, 0.3)) drop-shadow(0 10px 40px rgba(51, 102, 255, 0.4));
}"""

new_hm_map = """.hm-map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  fill: url(#hm-grad);
  filter: drop-shadow(0 0 20px rgba(0, 243, 255, 0.2)) drop-shadow(0 10px 40px rgba(51, 102, 255, 0.2));
  transition: filter 0.4s ease-out;
}
.hm-wrap:hover .hm-map {
  filter: drop-shadow(0 0 30px rgba(0, 243, 255, 0.4)) drop-shadow(0 15px 50px rgba(51, 102, 255, 0.6));
}"""

content = content.replace(old_hm_map, new_hm_map)

old_radar = """/* radar ripple rings — animate on hover/focus */
.hm-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--c);
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
}
.hm-marker.is-active .hm-ring {
  animation: hm-radar 1.5s infinite ease-out;
}
.hm-dot:focus-visible .hm-ring {
  animation: hm-radar 1.5s infinite ease-out;
}"""

new_radar = """/* radar ripple rings — animate on hover/focus */
@keyframes hm-radar {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
}
.hm-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--c);
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
}
.hm-dot:hover .hm-ring,
.hm-marker.is-active .hm-ring,
.hm-dot:focus-visible .hm-ring {
  animation: hm-radar 1.5s infinite ease-out;
}"""

content = content.replace(old_radar, new_radar)

with open('src/index.css', 'w') as f:
    f.write(content)
