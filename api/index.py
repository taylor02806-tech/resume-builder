import sys
import os

# 프로젝트 루트 경로를 sys.path에 추가하여 루트의 app.py를 안전하게 임포트
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
