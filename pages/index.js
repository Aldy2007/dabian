import { useState, useEffect } from 'react';
import { Card, Select, Typography, Row, Col, Layout, Modal, Tag, Space, Avatar, Empty, Divider, List, Form, Input, Button, message } from 'antd';
import { BookOutlined, UserOutlined, CalendarOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;
const { Option } = Select;
const { TextArea } = Input;

// Simple markdown renderer for handling headers
const renderContent = (content) => {
  return content.split('\n').map((line, idx) => {
    const match = line.match(/^(#+)\s+(.*)/);
    if (match) {
      const level = Math.min(match[1].length, 5); // h1 to h5
      return <Title key={idx} level={level} style={{ marginTop: 16 }}>{match[2]}</Title>;
    }
    // requirement says: md渲染只用写#的渲染，其他的不用管.
    return <Paragraph key={idx} style={{ fontSize: '16px', lineHeight: '1.8' }}>{line}</Paragraph>;
  });
};

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [filterAuthor, setFilterAuthor] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentsData, setCommentsData] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentForm] = Form.useForm();

  useEffect(() => {
    // Fetch articles
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
      });

    // Fetch comments
    fetch('/api/comments')
      .then(res => res.json())
      .then(data => {
        setCommentsData(data || {});
      })
      .catch(err => console.error("Could not fetch comments:", err));
  }, []);

  const filteredArticles = filterAuthor === 'All' 
    ? articles 
    : articles.filter(a => a.authorName === filterAuthor);

  const uniqueAuthors = Array.from(new Set(articles.map(a => a.authorName)));

  const showArticle = (article) => {
    setSelectedArticle(article);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedArticle(null);
    commentForm.resetFields();
  };

  const handleCommentSubmit = async (values) => {
    if (!selectedArticle) return;
    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          author: values.author,
          content: values.content
        })
      });
      if (response.ok) {
        const result = await response.json();
        setCommentsData(result.comments);
        message.success('Comment added successfully!');
        commentForm.resetFields();
      } else {
        message.error('Failed to add comment');
      }
    } catch (e) {
      console.error(e);
      message.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center' }}>
        <BookOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
        <Title level={3} style={{ margin: 0 }}>My Article Hub</Title>
      </Header>
      
      <Content style={{ padding: '40px 50px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Text strong style={{ marginRight: 15, fontSize: '16px' }}>Filter by Author:</Text>
          <Select 
            defaultValue="All" 
            style={{ width: 250 }} 
            size="large"
            onChange={setFilterAuthor}
            value={filterAuthor}
          >
            <Option value="All">All Authors</Option>
            {uniqueAuthors.map(author => (
              <Option key={author} value={author}>{author}</Option>
            ))}
          </Select>
        </div>

        {filteredArticles.length === 0 ? (
          <Empty description="No articles found" style={{ marginTop: '50px' }} />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredArticles.map(article => (
              <Col xs={24} sm={12} md={8} lg={6} key={article.id}>
                <Card 
                  hoverable
                  onClick={() => showArticle(article)}
                  style={{ borderRadius: '12px', overflow: 'hidden', height: '100%', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <Title level={4} style={{ marginBottom: 'auto', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.title}
                  </Title>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag icon={<UserOutlined />} color="blue" style={{ borderRadius: '4px' }}>
                      {article.authorName}
                    </Tag>
                    <Space size={16}>
                      <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
                        <MessageOutlined style={{ marginRight: 4 }} />
                        {commentsData[article.id] ? commentsData[article.id].length : 0}
                      </span>
                      {article.date && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <CalendarOutlined style={{ marginRight: '4px' }} />
                          {article.date}
                        </Text>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>
      
      <Footer style={{ textAlign: 'center', color: '#888' }}>
        Article Hub ©{new Date().getFullYear()} Created with Next.js & Ant Design
      </Footer>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        bodyStyle={{ padding: '40px' }}
        centered
      >
        {selectedArticle && (
          <article>
            <Title level={1}>{selectedArticle.title}</Title>
            <Space style={{ marginBottom: '24px' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text strong>{selectedArticle.authorName}</Text>
              {selectedArticle.date && (
                <>
                  <Divider type="vertical" />
                  <Text type="secondary"><CalendarOutlined style={{ marginRight: '6px' }} />{selectedArticle.date}</Text>
                </>
              )}
            </Space>
            <Divider style={{ margin: '12px 0 24px 0' }} />
            <div style={{ padding: '0 10px' }}>
              {renderContent(selectedArticle.content)}
            </div>
            
            <Divider style={{ marginTop: '40px' }} />
            
            <Title level={4}>Comments</Title>
            <List
              className="comment-list"
              itemLayout="horizontal"
              dataSource={commentsData[selectedArticle.id] || []}
              locale={{ emptyText: 'No comments yet. Be the first to comment!' }}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <Space>
                        <Text strong>{item.author}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(item.date).toLocaleString()}
                        </Text>
                      </Space>
                    }
                    description={<Paragraph style={{ marginTop: 8, color: '#333' }}>{item.content}</Paragraph>}
                  />
                </List.Item>
              )}
            />
            
            <div style={{ marginTop: '30px', background: '#fafafa', padding: '24px', borderRadius: '8px' }}>
              <Title level={5} style={{ marginBottom: 16 }}>Leave a Comment</Title>
              <Form form={commentForm} layout="vertical" onFinish={handleCommentSubmit}>
                <Form.Item name="author" label="Name" rules={[{ required: true, message: 'Please input your name!' }]}>
                  <Input placeholder="Enter your name" maxLength={50} />
                </Form.Item>
                <Form.Item name="content" label="Comment" rules={[{ required: true, message: 'Please write a comment!' }]}>
                  <TextArea rows={4} placeholder="What do you think about this article?" maxLength={500} showCount />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={isSubmittingComment} icon={<MessageOutlined />}>
                    Post Comment
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </article>
        )}
      </Modal>
    </Layout>
  );
}