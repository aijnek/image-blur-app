from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from mangum import Mangum
from PIL import Image, ImageFilter
import base64
import os
import io
import json
from typing import Dict

# 環境変数 STAGE が設定されていれば、root_path に利用する
stage = os.environ.get("STAGE", "")
root_path = f"/{stage}" if stage else ""

app = FastAPI(root_path=root_path)
app.mount("/static", StaticFiles(directory="static"), name="static")
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
        return templates.TemplateResponse("upload_error.html", {
            "request": request,
        })

@app.post("/apply_blur")
async def apply_blur(
    image: UploadFile = File(...)
):
    if not image.content_type.startswith('image/'):
        return Response(
            content=json.dumps({
                "error": "画像ファイルのみアップロード可能です。",
                "code": "INVALID_FILE_TYPE"
            }),
            media_type="application/json",
            status_code=400
        )

    try:
        # 画像データを読み込み
        image_bytes = await image.read()
        
        # 画像を開く
        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception:
            return Response(
                content=json.dumps({
                    "error": "無効な画像ファイルです。",
                    "code": "INVALID_IMAGE"
                }),
                media_type="application/json",
                status_code=400
            )
        
        # ガウシアンブラーを適用
        blurred_img = img.filter(ImageFilter.GaussianBlur(radius=10))
        
        # 画像をバイトデータとして保存
        img_byte_arr = io.BytesIO()
        blurred_img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        return Response(content=img_byte_arr, media_type="image/png")
    except Exception as e:
        print(f"Error in apply_blur: {str(e)}")
        return Response(
            content=json.dumps({
                "error": "画像の処理中にエラーが発生しました。",
                "code": "PROCESSING_ERROR"
            }),
            media_type="application/json",
            status_code=500
        )

# AWS Lambdaでの実行用にMangumハンドラを定義
handler = Mangum(app)
