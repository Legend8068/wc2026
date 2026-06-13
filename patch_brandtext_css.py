import re

with open('src/components/BrandText.css', 'r') as f:
    content = f.read()

old_css = """/* Confetti Animations upon hover of the ball */
.brand-char-ball:hover .confetti-wiggle {
  transform-box: fill-box;
  transform-origin: center;
  animation: confetti-wiggle 1.2s ease-in-out infinite;
}

.brand-char-ball:hover .confetti-spin {
  transform-box: fill-box;
  transform-origin: center;
  animation: confetti-spin 2s linear infinite;
}

.brand-char-ball:hover .confetti-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: confetti-pulse 1.4s ease-in-out infinite;
}

@keyframes confetti-wiggle {
  0% { transform: rotate(0deg) translate(0, 0); }
  25% { transform: rotate(8deg) translate(1px, -1px); }
  75% { transform: rotate(-8deg) translate(-1px, 1px); }
  100% { transform: rotate(0deg) translate(0, 0); }
}

@keyframes confetti-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.25); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes confetti-pulse {
  0% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.4) translate(0.5px, 0.5px); fill-opacity: 0.85; }
  100% { transform: scale(1) translate(0, 0); }
}"""

new_css = """/* Confetti Celebration Animations upon hover of the ball */
.brand-char-ball:hover .confetti-shoot-tl {
  transform-box: fill-box;
  transform-origin: center;
  animation: explode-tl 1.2s ease-out infinite;
}
.brand-char-ball:hover .confetti-shoot-tr {
  transform-box: fill-box;
  transform-origin: center;
  animation: explode-tr 1.4s ease-out infinite;
}
.brand-char-ball:hover .confetti-shoot-bl {
  transform-box: fill-box;
  transform-origin: center;
  animation: explode-bl 1.3s ease-out infinite;
}
.brand-char-ball:hover .confetti-shoot-br {
  transform-box: fill-box;
  transform-origin: center;
  animation: explode-br 1.5s ease-out infinite;
}
.brand-char-ball:hover .confetti-pop {
  transform-box: fill-box;
  transform-origin: center;
  animation: explode-pop 1.1s ease-out infinite;
}

@keyframes explode-tl {
  0% { transform: translate(15px, 15px) scale(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; transform: translate(10px, 10px) scale(1.2) rotate(-45deg); }
  100% { transform: translate(-25px, -35px) scale(0.8) rotate(-180deg); opacity: 0; }
}
@keyframes explode-tr {
  0% { transform: translate(-15px, 15px) scale(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; transform: translate(-10px, 10px) scale(1.2) rotate(45deg); }
  100% { transform: translate(25px, -35px) scale(0.8) rotate(180deg); opacity: 0; }
}
@keyframes explode-bl {
  0% { transform: translate(15px, -15px) scale(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; transform: translate(10px, -10px) scale(1.2) rotate(-45deg); }
  100% { transform: translate(-25px, 25px) scale(0.8) rotate(-90deg); opacity: 0; }
}
@keyframes explode-br {
  0% { transform: translate(-15px, -15px) scale(0) rotate(0deg); opacity: 0; }
  15% { opacity: 1; transform: translate(-10px, -10px) scale(1.2) rotate(45deg); }
  100% { transform: translate(25px, 25px) scale(0.8) rotate(90deg); opacity: 0; }
}
@keyframes explode-pop {
  0% { transform: scale(0); opacity: 0; }
  20% { transform: scale(1.8); opacity: 1; }
  100% { transform: scale(1) translateY(-20px); opacity: 0; }
}"""

content = content.replace(old_css, new_css)

with open('src/components/BrandText.css', 'w') as f:
    f.write(content)
