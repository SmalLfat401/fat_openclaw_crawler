# import requests

# url = "https://open.bigmodel.cn/api/paas/v4/async/images/generations"

# payload = {
#     "model": "glm-image",
#     "prompt": "一张背景图 各种不同ip的二次元吧唧雨",
#     "size": "1280x1280",
#     "quality": "hd",
#     "watermark_enabled": True,
#     "user_id": "65121710942269668"
# }
# headers = {
#     "Authorization": "Bearer 2f6f381cb392429ebf9cb3b440c1e343.sg44M08didBwwevk",
#     "Content-Type": "application/json"
# }

# response = requests.post(url, json=payload, headers=headers)
# import requests

# url = "https://open.bigmodel.cn/api/paas/v4/async/images/generations"

# payload = {
#     "model": "glm-image",
#     "prompt": "一张背景图 各种不同ip的二次元吧唧雨",
#     "size": "1280x1280",
#     "quality": "hd",
#     "watermark_enabled": True,
#     "user_id": "65121710942269668"
# }
# headers = {
#     "Authorization": "Bearer 2f6f381cb392429ebf9cb3b440c1e343.sg44M08didBwwevk",
#     "Content-Type": "application/json"
# }

# response = requests.post(url, json=payload, headers=headers)

# print("_______________  response.status_code  ________________")
# print(response.status_code)
# print("_______________  response.headers  ________________")
# print(response.headers)
# print("_______________  response.json()  ________________")
# print(response.json())
# print("_______________  response.text  ________________")
# print(response.text)


import requests

url = "https://open.bigmodel.cn/api/paas/v4/async-result/202604291116156e368df315234782"

headers = {"Authorization": "Bearer 2f6f381cb392429ebf9cb3b440c1e343.sg44M08didBwwevk"}

response = requests.get(url, headers=headers)

print("_______________  response.status_code  ________________")
print(response.status_code)
print("_______________  response.headers  ________________")
print(response.headers)
print("_______________  response.json()  ________________")
print(response.json())
print("_______________  response.text  ________________")
print(response.text)