from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from mangum import Mangum
import base64
import os

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
        # 画像以外の場合はテキストとして表示（テキスト変換できない場合はエラーメッセージ）
        try:
            text_content = contents.decode("utf-8")
        except UnicodeDecodeError:
            text_content = "バイナリファイルのためテキスト表示できません。"
        return templates.TemplateResponse("upload_text.html", {
            "request": request,
            "file_text": text_content
        })

# AWS Lambdaでの実行用にMangumハンドラを定義
handler = Mangum(app)
