-- SalonMate 초기 스키마 롤백

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_oauth_connections_updated_at ON oauth_connections;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_review_responses_updated_at ON review_responses;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS oauth_connections;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS review_responses;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS users;

DROP EXTENSION IF EXISTS "uuid-ossp";
