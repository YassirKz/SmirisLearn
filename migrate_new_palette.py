import os
import re

SRC_DIR = r"d:\smiris-learn\src"

def process_match(m):
    prefix = m.group(1) # dark: or empty
    prop = m.group(2)   # bg, text, border, ring, shadow, etc.
    color = m.group(3)  # deep_twilight, bright_teal_blue, etc.
    shade = m.group(4)  # -500 or empty
    opacity = m.group(5) # /50 or empty

    is_dark = bool(prefix)
    
    new_color = ""
    new_shade = shade or ""

    if color == 'deep_twilight':
        if prop == 'text':
            new_color = 'secondary'
            new_shade = '-100' if is_dark else '-900'
        elif prop in ('bg', 'border', 'ring'):
            new_color = 'primary'
            new_shade = '-600'
        elif prop == 'shadow':
            new_color = 'primary'
            new_shade = '-600'
        else:
            new_color = 'secondary'
            new_shade = '-900'

    elif color == 'bright_teal_blue':
        new_color = 'primary'
        if not new_shade:
            new_shade = '-500'

    elif color == 'turquoise_surf':
        new_color = 'accent'
        if not new_shade:
            new_shade = '-500'

    elif color == 'frosted_blue':
        if prop == 'bg':
            if is_dark:
                new_color = 'slate'
                new_shade = '-900'
            else:
                new_color = 'white'
                new_shade = '' # bg-white
        else:
            new_color = 'secondary'
            new_shade = '-300'

    elif color == 'light_cyan':
        if prop == 'bg':
            new_color = 'secondary'
            new_shade = '-200' if shade == '-700' else '-50'
        elif prop == 'border':
            new_color = 'secondary'
            new_shade = '-200'
        elif prop == 'text':
            new_color = 'secondary'
            new_shade = '-500'
        else:
            new_color = 'secondary'
            new_shade = '-100'

    return f"{prefix}{prop}-{new_color}{new_shade}{opacity or ''}"


def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return 0
        
    original = content
    
    # Regex to match Tailwind classes like dark:bg-deep_twilight-600/50
    # Group 1: prefix (e.g. "dark:", "hover:", "sm:hover:", "dark:hover:")
    # Group 2: property (bg, text, border, ring, shadow, etc)
    # Group 3: old color name
    # Group 4: shade (e.g. -500, -300)
    # Group 5: opacity (e.g. /50)
    
    pattern = r'((?:[a-z0-9]+:)*)(bg|text|border|ring|shadow|from|via|to)-(deep_twilight|bright_teal_blue|turquoise_surf|frosted_blue|light_cyan)(-\d+)?(/\d+)?'
    
    content, count = re.subn(pattern, process_match, content)

    # Some manual fallbacks for isolated color names that weren't caught
    content = content.replace('deep_twilight', 'secondary-900')
    content = content.replace('bright_teal_blue', 'primary-500')
    content = content.replace('turquoise_surf', 'accent-500')
    content = content.replace('frosted_blue', 'secondary-300')
    content = content.replace('light_cyan', 'secondary-100')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  FIXED: {filepath}")
        return 1
    return 0

def main():
    total_files = 0
    for root, dirs, files in os.walk(SRC_DIR):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for fname in files:
            if fname.endswith(('.jsx', '.tsx', '.js', '.ts', '.css')):
                filepath = os.path.join(root, fname)
                total_files += process_file(filepath)
                
    print(f"\nDONE: Modified {total_files} files")

if __name__ == '__main__':
    main()
