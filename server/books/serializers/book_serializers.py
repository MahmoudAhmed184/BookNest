from rest_framework import serializers
from books.models import Book, Author, ReadingList, BookAuthor , Genre


class BookGenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["name"]


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["author_id", "name", "number_of_books"]


class BookSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True)
    genres = serializers.ListField(child=serializers.CharField(), write_only=True)
    reviews_count = serializers.SerializerMethodField(read_only=True)
    # average_rate = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)

    class Meta:
        model = Book
        fields = [
            "isbn13",
            "isbn",
            "title",
            "authors",
            "genres",
            "average_rate",
            "description",
            "publication_date",
            "number_of_pages",
            "cover_img",
            "number_of_ratings",
            "reviews_count",
            "language",
            "source",
            
        ]
        
    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Replace genre names from the M2M field directly
        rep["genres"] = list(instance.genres.values_list("name", flat=True))
        return rep

    def create(self, validated_data):
        authors_data = validated_data.pop("authors") # pop authors data from validated data to use it in creating book authors through BookAuthor model
        genres_data = validated_data.pop("genres", []) # pop genres data from validated data to use it in creating book genres through BookGenre model
        book = Book.objects.create(**validated_data) # create the book instance with the rest of the validated data fields 

        for author_data in authors_data:
            author, created = Author.objects.get_or_create(**author_data) # get or create author instance from the author data 
            BookAuthor.objects.create(book=book, author=author) # create the book author instance with the book and author instances

        for genre_name in genres_data:
            genre, created = Genre.objects.get_or_create(name=genre_name)
            book.genres.add(genre)
            
        return book 

    def update(self, instance, validated_data):
        authors_data = validated_data.pop("authors" , None)
        genres_data = validated_data.pop("genres", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        
        if authors_data is not None:
            instance.authors.clear()
            for author_data in authors_data:
                author, created = Author.objects.get_or_create(**author_data)
                BookAuthor.objects.create(book=instance, author=author)

        if genres_data is not None:
            genre_instances = []
            for genre_name in genres_data:
                genre, created = Genre.objects.get_or_create(name=genre_name)
                genre_instances.append(genre)
            instance.genres.set(genre_instances)

        return instance



class ReadingListSerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()
    owner_username = serializers.SerializerMethodField()
    books=BookSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format='%a %b %d %Y at %I:%M %p', read_only=True)
    
    class Meta:
        model = ReadingList
        fields = ["list_id", "name", "type", "privacy", "created_at", "book_count", "owner_username", "books"]
        read_only_fields = ["list_id", "created_at", "book_count", "owner_username"]
    
    def get_book_count(self, obj):
        return obj.books.count()
    
    def get_owner_username(self, obj):
        return obj.profile.user.username if obj.profile and obj.profile.user else None


# class ReadingListDetailSerializer(ReadingListSerializer):
#     # books = BookSerializer(many=True, read_only=True)

#     # class Meta(ReadingListSerializer.Meta):
#     #     fields = ReadingListSerializer.Meta.fields + ["books"]
