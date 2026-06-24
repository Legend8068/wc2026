import json

log_path = '/Users/ayush/.gemini/antigravity-ide/brain/90ed6469-c013-4b31-a5d7-c4ce80e441fc/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            step = json.loads(line)
            if 'tool_calls' in step:
                for call in step['tool_calls']:
                    if call.get('name') == 'run_command':
                        args = call.get('arguments', {})
                        cmd = args.get('CommandLine', '')
                        if 'SingaporeMapIcon.jsx' in cmd and 'writeFileSync' in cmd:
                            print("FOUND IT!")
                            print("-------------------")
                            print(cmd)
                            print("-------------------")
                        elif 'SingaporeMapIcon.jsx' in cmd and 'node' in cmd:
                            print("FOUND NODE SCRIPT:")
                            print("-------------------")
                            print(cmd)
                            print("-------------------")
        except Exception as e:
            pass
