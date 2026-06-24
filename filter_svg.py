import re

with open('src/components/SingaporeMapIcon.jsx', 'r') as f:
    content = f.read()

match = re.search(r'd="([^"]+)"', content)
if match:
    d = match.group(1)
    
    # Split by 'M'
    # 'M' starts a new subpath. Some might use 'Z' at the end.
    subpaths = []
    # Find all occurrences of M followed by everything until the next M
    for m in re.finditer(r'M[^M]+', d):
        subpath = m.group(0)
        # Check if subpath contains straight lines typical of a bounding box
        # e.g., L61.44,339.563 or similar
        # We can just check if any coordinate is x < 100 AND y > 300
        # Let's extract all numbers
        nums = re.findall(r'-?\d+\.?\d*', subpath)
        is_bbox = False
        
        # Let's also calculate the bounding box of the subpath
        xs = [float(nums[i]) for i in range(0, len(nums)-1, 2) if i % 2 == 0]
        ys = [float(nums[i]) for i in range(1, len(nums), 2) if i % 2 != 0]
        
        # A simple heuristic: if it goes very far out and has very few points
        # Wait, the maritime border is HUGE and has many points.
        # Let's just look at the raw string for straight horizontal/vertical lines.
        # e.g., L61.443,376.087L61.444,387.284
        if "329.43" in subpath or "376.08" in subpath or "394.832" in subpath:
            is_bbox = True
            
        if not is_bbox:
            subpaths.append(subpath)

    new_d = "".join(subpaths)
    new_content = content.replace(d, new_d)
    
    with open('src/components/SingaporeMapIcon.jsx', 'w') as f:
        f.write(new_content)
    print("Filtered out bounding box subpaths.")
