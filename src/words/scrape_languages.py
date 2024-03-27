import requests
import time

# Use requests to GET https://monkeytype.com/languages/_list.json and get the array.
request = requests.get('https://monkeytype.com/languages/_list.json')
# Convert the response to a JSON object.
languages = request.json()
wait_time = 1000
for l in languages:
	print("Requesting @" + l)
	# Use requests to GET https://monkeytype.com/languages/{lang} and get the HTML.
	request = requests.get(f'https://monkeytype.com/languages/{l}.json')
	# Convert the response to a JSON object.
	language = request.json()
	# Save the JSON object to a local file named {l}.json
	print("Loaded & Saving @" + l)
	with open(f'{l}.json', 'w') as file:
		file.write(request.text)
	# Wait 1 second before making the next request.
	print(f'Done & Waiting @ {(wait_time)} ms')
	time.sleep(wait_time/1000)
print(f'\nALL CLEAR! Downloaded {len(languages)} langs.')