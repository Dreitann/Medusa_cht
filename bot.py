# bot.py
import os
from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
import asyncio

TOKEN = "7901700367:AAFZcoL1NWWrEhtwQFBury02pivHMfzCnzU"  # вставь сюда свой токен

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message()
async def handle_message(message: types.Message):
    kb = ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(KeyboardButton(
        text="Открыть Web App",
        web_app=WebAppInfo(url="https://твой-домен или localhost/index.html")
    ))
    await message.answer("Нажми кнопку, чтобы открыть мини-приложение", reply_markup=kb)

if __name__ == "__main__":
    asyncio.run(dp.start_polling(bot))
