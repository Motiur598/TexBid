from colorthief import ColorThief
import math

# Sample Pantone mapping (RGB to Name)
PANTONE_COLORS = [
    ((19, 42, 63), "PANTONE 19-4052 TCX Classic Blue"),
    ((65, 64, 60), "PANTONE 19-4033 TCX Classic Grey"),
    ((240, 240, 240), "PANTONE 19-4006 TCX White Navy"),
    ((194, 156, 105), "PANTONE 16-1144 TCX Oxford Tan"),
    ((155, 126, 86), "PANTONE 17-1044 TCX Rawhide"),
    ((44, 64, 89), "PANTONE 19-4035 TCX Salute"),
    ((138, 30, 65), "PANTONE 19-1536 TCX Red"),
    ((71, 105, 48), "PANTONE 18-0527 TCX Olive"),
]

def closest_pantone(rgb):
    min_dist = float('inf')
    best_match = None
    for p_rgb, p_name in PANTONE_COLORS:
        # Euclidean distance
        dist = math.sqrt((rgb[0] - p_rgb[0])**2 + (rgb[1] - p_rgb[1])**2 + (rgb[2] - p_rgb[2])**2)
        if dist < min_dist:
            min_dist = dist
            best_match = (p_rgb, p_name)
    return best_match

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % rgb

print(closest_pantone((20, 45, 60)))
