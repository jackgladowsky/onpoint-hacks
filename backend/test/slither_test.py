import subprocess
import os
import re

def get_declared_solc_version(path):
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            # Look for a line like: pragma solidity ^0.8.0;
            m = re.match(r'^\s*pragma\s+solidity\s+([^;]+);', line)
            if m:
                if m.group(1).strip()[0] == '^':
                    return m.group(1).strip()[1:]
                else:
                    return m.group(1).strip()
    return None

if __name__ == "__main__":

    filename = r"C:\Users\malte\onpoint-hacks\backend\test\Unprotected.sol"

    declared = get_declared_solc_version(filename)
    print(declared)

    # Inherit your current environment and add FORCE_COLOR
    env = os.environ.copy()
    env["FORCE_COLOR"] = "1"


    # Set solc version
    try:
        result = subprocess.run(
            ['solc-select', 'use', declared, '--always-install'],
            capture_output=True,
            text=True,
            env=env,
            check=True
        )

        print("=== STDOUT ===")
        print(result.stdout or "[No stdout output]")
        print("=== STDERR ===")
        print(result.stderr or "[No stderr output]")

    except subprocess.CalledProcessError as e:
        print("❌ Error:", e.stderr)



    try:
        result = subprocess.run(
            ['slither', filename, '--print', 'human-summary,contract-summary,data-dependency,inheritance,vars-and-auth,variable-order'],
            capture_output=True,
            text=True,
            env=env,
            check=True
        )

        print("=== STDOUT ===")
        print(result.stdout or "[No stdout output]")
        print("=== STDERR ===")
        print(result.stderr or "[No stderr output]")

    except subprocess.CalledProcessError as e:
        print("❌ Error:", e.stderr)

