import sys
from rembg import remove


def main():
    if len(sys.argv) != 3:
        print("Usage: rembg_runner.py <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        with open(input_path, "rb") as f:
            input_data = f.read()

        output_data = remove(input_data)

        with open(output_path, "wb") as f:
            f.write(output_data)
    except Exception as e:
        print(f"rembg processing failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
