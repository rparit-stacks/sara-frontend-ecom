import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import AnimatedWaveBackground from '@/components/animations/AnimatedWaveBackground';
import InquiryPageView from '@/components/inquiry/InquiryPageView';
import { manufacturingApi } from '@/lib/api';
import { DEFAULT_INQUIRY_CONTENT, normalizeInquiryContent } from '@/components/inquiry/inquiryContent';

const Inquiry = () => {
  const { data } = useQuery({
    queryKey: ['inquiry-content'],
    queryFn: () => manufacturingApi.getInquiryContent(),
  });

  const content = data ? normalizeInquiryContent(data) : DEFAULT_INQUIRY_CONTENT;

  return (
    <Layout>
      <AnimatedWaveBackground />
      <InquiryPageView content={content} />
    </Layout>
  );
};

export default Inquiry;
