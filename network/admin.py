from django.contrib import admin

from network.models import User, Follow, Post, Like

class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")
    fields = ["username", "email", "password"]

class FollowsAdmin(admin.ModelAdmin):
    list_display = ("user", "follow")
    fields = ["user", "follow"]

class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'text')
    fields = ('user', 'text')

class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post')
    fields = ('user', 'post')

# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Follow, FollowsAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Like, LikeAdmin)