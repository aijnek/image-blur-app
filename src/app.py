from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from mangum import Mangum
from PIL import Image, ImageFilter
import base64
import os
import io
from pydantic import BaseModel
from typing import Dict

class BlurRequest(BaseModel):
    image: str
    rect: Dict[str, int]

# 環境変数 STAGE が設定されていれば、root_path に利用する
stage = os.environ.get("STAGE", "")
root_path = f"/{stage}" if stage else ""

app = FastAPI(root_path=root_path)
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload", response_class=HTMLResponse)
async def upload(request: Request, file: UploadFile = File(...)):
    # アップロードされたファイルの内容を読み込み
    contents = await file.read()
    file_name = file.filename

    if file.content_type.startswith("image/"):
        # 画像の場合はBase64エンコードしてテンプレートに渡す
        encoded = base64.b64encode(contents).decode("utf-8")
        return templates.TemplateResponse("upload_image.html", {
            "request": request,
            "file_content": encoded,
            "content_type": file.content_type,
            "file_name": file_name
        })
    else:
        # 画像以外の場合はテキストとして表示
        try:
            text_content = contents.decode("utf-8")
        except UnicodeDecodeError:
            text_content = "バイナリファイルのためテキスト表示できません。"
        return templates.TemplateResponse("upload_text.html", {
            "request": request,
            "file_text": text_content
        })

@app.post("/apply_blur")
async def apply_blur(blur_request: BlurRequest):
    # Base64画像データをデコード
    image_data = blur_request.image.split(',')[1]
    image_bytes = base64.b64decode(image_data)
    
    # PILイメージとして開く
    img = Image.open(io.BytesIO(image_bytes))
    
    # 選択された領域を切り出し
    rect = blur_request.rect
    region = img.crop((rect['x'], rect['y'], 
                      rect['x'] + rect['width'], 
                      rect['y'] + rect['height']))
    
    # ガウシアンブラーを適用
    blurred_region = region.filter(ImageFilter.GaussianBlur(radius=10))
    
    # ブラー処理した領域を元の画像に貼り付け
    img.paste(blurred_region, (rect['x'], rect['y']))
    
    # 画像をバイトデータとして保存
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    return Response(content=img_byte_arr, media_type="image/png")

# AWS Lambdaでの実行用にMangumハンドラを定義
handler = Mangum(app)
